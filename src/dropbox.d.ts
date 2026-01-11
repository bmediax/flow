// eslint-disable-next-line no-unused-vars
import { Dropbox, DropboxAuth } from 'dropbox'

// https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation
export declare module 'dropbox' {
  interface Dropbox {
    auth: DropboxAuth
  }
}
