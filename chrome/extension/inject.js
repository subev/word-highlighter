import Mark from 'mark.js';
import { fromEvent, of } from 'rxjs';
import { filter, tap, map, mapTo, delay, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

const logEnabled = true;
let lastSelection = '';

/*eslint-disable */
const log = text => tap((x) => {
  if (logEnabled) {
    console.log(text, x);
  }
  return x;
});
/*eslint-enable */

const selection = () => window.getSelection().toString();
const escapeRegExp = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const instance = new Mark(document.querySelectorAll('div,a,span,p,td,code'));
const clearMark = () => {
  instance.unmark({});
  lastSelection = undefined;
};

const highlight = (text) => {
  if (text === lastSelection) {
    return;
  }
  clearMark();
  //console.log(`highlight for '${text}'`);
  instance.markRegExp(new RegExp(escapeRegExp(text), 'g'), {
    iframes: false,
    debug: true
  });
  lastSelection = text;
};
const noSpecialKeyPressed = e => !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey);
const targetIsNotElementOfTypes = ts => e => ts.every(t => !(e.target instanceof t));
const isNotContentEditable = ({ target }) => {
  if (target instanceof Element && target.attributes.contenteditable) {
    return false;
  }

  return true;
};

const doubleClick$ = fromEvent(document, 'dblclick');
const keyUp$ = fromEvent(document, 'keyup');
const keyDown$ = fromEvent(document, 'keydown');
const mouseDown$ = fromEvent(document, 'mousedown');
const mouseUp$ = fromEvent(document, 'mouseup');
const mouseMove$ = fromEvent(document, 'mousemove');
const validDoubleClick$ = doubleClick$.pipe(
  filter(noSpecialKeyPressed),
  filter(isNotContentEditable)
);

const escapePress$ = keyUp$
  .pipe(filter(me => me.keyCode === 27));

escapePress$
  .subscribe(clearMark);

// draging is not considered click, users might want to select to copy smth while highlighted
const noDragClick$ = mouseDown$
  .pipe(
    filter(
      targetIsNotElementOfTypes([
        HTMLButtonElement,
        HTMLInputElement,
        HTMLAnchorElement,
      ])
    ),
    switchMap(md => mouseUp$.pipe(
      mapTo(md),
      takeUntil(mouseMove$)
    ))
  );

// single click is done when no double click has been triggered
const singleClick$ = noDragClick$
  .pipe(
    filter(noSpecialKeyPressed),
    switchMap(e => of(e).pipe(
      delay(200),
      takeUntil(doubleClick$),
    ))
  );

singleClick$
  .subscribe(clearMark);

// when alt down and manual selection with mouse
keyDown$
  .pipe(
    filter(e => e.altKey),
    switchMap(() => mouseUp$.pipe(
      filter(isNotContentEditable),
      takeUntil(keyUp$)
    )),
    map(selection),
    distinctUntilChanged()
  )
  .subscribe(highlight);

// double click highlight
validDoubleClick$
  .pipe(
    map(selection),
    filter(x => x.trim()),
  )
  .subscribe(highlight);
