/** Self-rated conviction, 1-10. The number is the label; the track is a
 *  secondary read, not the only one. */
export default function Score({ value }: { value: number }) {
  return (
    <span className="score">
      <span className="trk" aria-hidden="true">
        <i style={{ width: `${value * 10}%` }} />
      </span>
      {value} of 10
    </span>
  );
}
