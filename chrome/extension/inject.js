import Mark from 'mark.js';
import { fromEvent } from 'rxjs';
import { filter, map, mapTo, mergeMap, concatMap, first, last, takeUntil } from 'rxjs/operators';

const log = (x) => {
  console.log(x, new Date());
  return x;
};

const getRange = () => window.getSelection().getRangeAt(0);
const escapeRegExp = text => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

const restoreSelection = (range) => {
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
};

const isSameContainer = range => (
  (range.startContainer === range.commonAncestorContainer)
    && (range.endContainer === range.commonAncestorContainer)
);

const instance = new Mark(document.querySelectorAll('div,a,span,p,td,code'));
const clearMark = () => instance.unmark({});

const highlight = () => {
  const savedRange = getRange();
  if (!isSameContainer(savedRange)) {
    // complex ranges are not supported
    return;
  }
  const selectedText = window.getSelection().toString().trim();
  console.log('HIGHLIGHT', selectedText);
  clearMark();
  instance.markRegExp(new RegExp(escapeRegExp(selectedText), 'g'), {
    iframes: false,
    debug: true
  });
  restoreSelection(savedRange);
};

fromEvent(document, 'dblclick')
  .pipe(filter(({ target }) => !(target instanceof HTMLInputElement)))
  .subscribe(highlight);

fromEvent(document, 'keyup')
  .pipe(filter(me => me.keyCode === 27))
  .subscribe(clearMark);

fromEvent(document, 'selectionchange')
  .pipe(
    // normal clicks that have no selection are also considered selections
    filter(() => window.getSelection().toString()),
    concatMap(sc =>
      fromEvent(document, 'mouseup')
      .pipe(first(), mapTo(sc))
    )
  )
  .pipe(
    map(getRange),
    filter(isSameContainer),
  )
  .subscribe(highlight);
