Suggestions for project: 1. add styles with cssmodules to each page so styles doesn't apply global. 2. all of the types of Products are any, define them in types.ts 3. avoid overlapping fetches by canceling outdated requests 4. use tanstack-query for caching stable data like:
cache popular search results and sorted pages for common queries. 5. use react-window or something like that for better performance in loading 5000 products 6. keep product detail and recommendation logic simple and offload ranking/scoring to the backend; front end should only render event data. 7. replace in-memory filtering with a real paginated catalogue API backed by a database or search index. 8. ove from naive string scanning to a search engine designed for scale: e.g. Elasticsearch, OpenSearch, or a managed search service. 9. load only the current page of products and necessary summary metadata; avoid loading all products into the browser or server process. 10. use server-side rendering / edge rendering for listing and detail pages to preserve SEO while hydrating interactive UI.
What i have done for project: 1. added a lightweight analytics helper 2. instrumented CatalogShell for:
search terms
filter changes
catalog impressions
pagination clicks
view-mode changes
product fetches 3. ept the integration small and mobile-friendly by using navigator.sendBeacon when available, with a fallback to fetch 4. added debounce to minime requests to api 5. persist data with localstorage and kept url clean 6. worked on SEO and accesssibility such as aria- values and metadata. 7. worked on performance and some extra re-renders. 8. created a branch for every task (not deleted them for your interest)
Final question: 1. performance matters such as:
debounce
rerenders
react-window
react-query 2. type safety, make the development easier and maybe faster 3. convert the architect to feature-based strategy that every feature has their own repository like, like styles types and so on.
