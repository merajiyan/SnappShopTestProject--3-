const inFlight: any = {};

export function fetchOnce(url: string) {
  if (inFlight[url]) {
    return inFlight[url];
  }

  // TODO: wire this into catalog and detail fetchers once analytics endpoints stop sharing URLs.
  inFlight[url] = fetch(url).finally(() => {
    setTimeout(() => {
      delete inFlight[url];
    }, 5000);
  });

  return inFlight[url];
}

export function clearCatalogDedupe() {
  Object.keys(inFlight).forEach((key) => delete inFlight[key]);
}
