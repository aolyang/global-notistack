# global-notistack
Easy global api for notistack.

easy to use, fully support for [notistack:demo](https://iamhosseindhv.com/notistack), [notistack:github](https://github.com/iamhosseindhv/notistack)

## How?

1. copy file [/notify.tsx](./notify.tsx) at root directory into your code(typescript default);
2. modify theme provider or remove it;
3. enjoy;

```typescript
import { msg } from "./somewhere/notify.tsx"

// basic
msg.open("default toast msg!")
msg.success("oh success msg!")
// error, warning... support to, see code

// options
msg.info("a info msg!", notistackOptions)
```

## more

It already has an example code `export const notify` for custom provider props and special config.

## end

feel free to improve this code by commit a PR.