// const docEntry = window['doc-entry'].default;
import docEntry from './docEntry';
import $docs from './empty';
import * as Components from '@';

docEntry($docs, Components, process.env.NODE_ENV);
