import Mark from 'mark.js';
import { fromEvent, of } from 'rxjs';
import { filter, tap, map, mapTo, distinct, distinctUntilChanged, debounceTime, switchMap, takeUntil, last } from 'rxjs/operators';

const onSelectEnabled = true;

const log = text => x => {
  console.log(text, x);
  return x;
};

const selection = () => window.getSelection().toString();
const clearSelection = () => window.getSelection().removeAllRanges();
const escapeRegExp = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const isSameContainer = range => (
  (range.startContainer === range.commonAncestorContainer)
    && (range.endContainer === range.commonAncestorContainer)
);

const instance = new Mark(document.querySelectorAll('div,a,span,p,td,code'));
const clearMark = () => instance.unmark({});

const highlight = (text) => {
  console.log('HIGHLIGHT', `'${text}'`);
  clearMark();
  instance.markRegExp(new RegExp(escapeRegExp(text), 'g'), {
    iframes: false,
    debug: true
  });
};

const docClick$ = fromEvent(document, 'click');
const doubleClicks$ = fromEvent(document, 'dblclick');
const selectionChange$ = fromEvent(document, 'selectionchange');
const keyUp$ = fromEvent(document, 'keyup');
const keydown$ = fromEvent(document, 'keydown');
const mouseUp$ = fromEvent(document, 'mouseup');

const escapePress = keyUp$
  .pipe(filter(me => me.keyCode === 27));

escapePress
  .subscribe(clearMark);

//docClick$
  //.pipe(
    //tap(log('click')),
    //switchMap(e => of(e).pipe(takeUntil(doubleClicks$)))
  //)
  //.subscribe(clearMark);

keydown$
  .pipe(
    filter(e => e.altKey),
    switchMap(() => selectionChange$.pipe(
      takeUntil(mouseUp$),
      last(),
    )),
    map(selection),
    distinctUntilChanged()
  )
  .subscribe(highlight);

doubleClicks$
  .pipe(
    filter(e => !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)),
    map(selection),
    distinctUntilChanged()
  )
  .subscribe(highlight);
