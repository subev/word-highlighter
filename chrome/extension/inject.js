import Mark from 'mark.js';
import { fromEvent } from 'rxjs';
import { filter, map, mapTo, distinctUntilChanged, debounceTime, switchMap } from 'rxjs/operators';

const onSelectEnabled = true;

const log = (x) => {
  console.log(x);
  return x;
};

const selection = () => window.getSelection().toString();
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

fromEvent(document, 'keyup')
  .pipe(filter(me => me.keyCode === 27))
  .subscribe(clearMark);

if (onSelectEnabled) {
  fromEvent(document, 'selectionchange')
    .pipe(
      map(selection),
      debounceTime(200),
      distinctUntilChanged(),
    )
    .subscribe(highlight);
} else {
  const doubleClicks = fromEvent(document, 'dblclick');
  doubleClicks
    .pipe(
      filter(e => !(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey)),
      map(selection),
      distinctUntilChanged(),
    )
    .subscribe(highlight);
}
