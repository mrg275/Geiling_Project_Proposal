import { book } from "@/lib/data";

/** Five "different" AI names, and how much of one bet they really are.
 *  Single hue, light to dark, and every cell prints its own number so the
 *  colour never has to be decoded. */
export default function CorrelationMatrix() {
  const { tickers, values } = book.correlationMatrix;
  const bin = (v: number) => (v >= 0.95 ? 5 : v >= 0.8 ? 4 : v >= 0.7 ? 3 : v >= 0.6 ? 2 : 1);

  return (
    <section className="pane">
      <header>
        <h2>Correlation inside the AI sleeve</h2>
        <span className="hint">90-day daily returns</span>
      </header>
      <div className="pad">
        <div className="tw">
          <table className="cm">
            <thead>
              <tr>
                <th />
                {tickers.map((t) => (
                  <th key={t} scope="col">
                    {t}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tickers.map((rowTicker, i) => (
                <tr key={rowTicker}>
                  <td className="h">{rowTicker}</td>
                  {tickers.map((colTicker, j) => (
                    <td className={`c b${bin(values[i][j])}`} key={colTicker}>
                      {i === j ? "—" : values[i][j].toFixed(2)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="fine" style={{ marginTop: 14 }}>
          Every cell carries its number; colour only speeds up the scan.
        </p>
      </div>
    </section>
  );
}
