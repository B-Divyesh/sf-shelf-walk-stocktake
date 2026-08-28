# Demo sandbox

Open `/demo/` (or `/?demo=1`) to start the six-item hardware shelf-count sample.
The first screen is already the count view, so no file or account is required.

The demo uses the IndexedDB database `demo:shelf-walk-stocktake`; ordinary work
uses `shelf-walk-stocktake`. Demo mode never reads or writes the ordinary
database. The persistent banner offers **Reset demo**, which reseeds the bundled
sample, and **Start for real**, which deletes the demo database before returning
to the import screen.

The bundled sample contains nuts, washers, tape, gloves, cable ties, and cleaner
across six realistic aisle/bay/shelf paths. It is included in the app bundle, so
the demo remains available after the first visit when offline.
