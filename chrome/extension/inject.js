import Mark from 'mark.js';
import { fromEvent, of } from 'rxjs';
import { filter, tap, map, mapTo, delay, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

const logEnabled = false;

const log = text => tap((x) => {
  if (logEnabled) {
    console.log(text, x);
  }
  return x;
});

const selection = () => window.getSelection().toString();
const escapeRegExp = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const instance = new Mark(document.querySelectorAll('div,a,span,p,td,code'));
const clearMark = () => instance.unmark({});

const highlight = (text) => {
  //console.log(`highlight for '${text}'`);
  clearMark();
  instance.markRegExp(new RegExp(escapeRegExp(text), 'g'), {
    iframes: false,
    debug: true
  });
};
const noSpecialKeyPressed = e => !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey);

const doubleClick$ = fromEvent(document, 'dblclick');
const keyUp$ = fromEvent(document, 'keyup');
const keyDown$ = fromEvent(document, 'keydown');
const mouseDown$ = fromEvent(document, 'mousedown');
const mouseUp$ = fromEvent(document, 'mouseup');
const mouseMove$ = fromEvent(document, 'mousemove');
const validDoubleClick$ = doubleClick$.pipe(
  filter(noSpecialKeyPressed)
);

const escapePress$ = keyUp$
  .pipe(filter(me => me.keyCode === 27));

escapePress$
  .subscribe(clearMark);

// draging is not considered click, users might want to select to copy smth while highlighted
const noDragClick$ = mouseDown$
  .pipe(
    switchMap(md => mouseUp$.pipe(
      mapTo(md),
      takeUntil(mouseMove$)
    )),
  );

// single click is done when no double click has been triggered
const singleClick$ = noDragClick$
  .pipe(
    filter(noSpecialKeyPressed),
    switchMap(e => of(e).pipe(
      delay(300),
      takeUntil(doubleClick$),
    )),
  );

singleClick$
  .subscribe(clearMark);

// when alt down and manual selection with mouse
keyDown$
  .pipe(
    filter(e => e.altKey),
    switchMap(() => mouseUp$.pipe(takeUntil(keyUp$))),
    map(selection),
    distinctUntilChanged()
  )
  .subscribe(highlight);

// double click highlight
validDoubleClick$
  .pipe(
    map(selection),
    filter(x => x.trim()),
    distinctUntilChanged(),
    // this forces unique until flush occurs
    //distinct(x => x, merge(escapePress$, singleClick$))
  )
  .subscribe(highlight);
