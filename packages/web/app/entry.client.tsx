import { RemixBrowser } from '@remix-run/react'
import { startTransition, StrictMode } from 'react'
import { hydrateRoot } from 'react-dom/client'

// https://gist.github.com/OnurGvnc/31f03f0d5237b78224aa083493fda645
function clearBrowserExtensionInjectionsBeforeHydration() {
  document
    .querySelectorAll(
      [
        'html > *:not(body, head)',
        'script[src*="extension://"]',
        'link[href*="extension://"]',
      ].join(', ')
    )
    .forEach((s) => {
      s.parentNode?.removeChild(s)
    })

  const $targets = {
    html: {
      $elm: document.querySelector('html')!,
      allowedAttributes: ['lang', 'dir', 'class'],
    },
    head: {
      $elm: document.querySelector('head')!,
      allowedAttributes: [''],
    },
    body: {
      $elm: document.querySelector('body')!,
      allowedAttributes: ['class'],
    },
  }

  Object.entries($targets).forEach(([targetName, target]) => {
    target.$elm.getAttributeNames().forEach((attr) => {
      if (!target.allowedAttributes.includes(attr)) {
        target.$elm.removeAttribute(attr)
      }
    })
  })
}

function hydrate() {
  clearBrowserExtensionInjectionsBeforeHydration()

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <RemixBrowser />
      </StrictMode>
    )
  })
}

if (window.requestIdleCallback) {
  window.requestIdleCallback(hydrate)
} else {
  // Safari doesn't support requestIdleCallback
  // https://caniuse.com/requestidlecallback
  window.setTimeout(hydrate, 1)
}