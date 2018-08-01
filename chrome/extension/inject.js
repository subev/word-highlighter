import Mark from 'mark.js';
import { fromEvent, of } from 'rxjs';
import { filter, tap, map, delay, distinctUntilChanged, switchMap, takeUntil } from 'rxjs/operators';

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
  clearMark();
  instance.markRegExp(new RegExp(escapeRegExp(text), 'g'), {
    iframes: false,
    debug: true
  });
};
const noSpecialKeyPressed = e => !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey);

const docClick$ = fromEvent(document, 'click');
const doubleClicks$ = fromEvent(document, 'dblclick').pipe(log('double click'));
const keyUp$ = fromEvent(document, 'keyup');
const keyDown$ = fromEvent(document, 'keydown');
const mouseUp$ = fromEvent(document, 'mouseup');
const validDoubleClick$ = doubleClicks$.pipe(
  filter(noSpecialKeyPressed)
);

const escapePress$ = keyUp$
  .pipe(filter(me => me.keyCode === 27));

escapePress$
  .subscribe(clearMark);

const singleClick$ = docClick$
  .pipe(
    filter(noSpecialKeyPressed),
    switchMap(e => of(e).pipe(
      delay(300),
      takeUntil(doubleClicks$)
    ))
  );

singleClick$
  .subscribe(clearMark);

keyDown$
  .pipe(
    filter(e => e.altKey),
    switchMap(() => mouseUp$.pipe(takeUntil(keyUp$))),
    map(selection),
    distinctUntilChanged()
  )
  .subscribe(highlight);

validDoubleClick$
  .pipe(
    map(selection),
    filter(x => x.trim()),
    distinctUntilChanged(),
    // this forces unique until flush occurs
    //distinct(x => x, merge(escapePress$, singleClick$))
  )
  .subscribe(highlight);
