interface Props {
  x?: string,
  y?: string,
  payload?: Payload
}

interface Payload {
  value: any
}

const TickXAxis = ({ x, y, payload }: Props) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#fff"
        transform="rotate(-35)"
        className="text-lg font-tertiary"
      >
        {payload?.value}
      </text>
    </g>
  )
}

export default TickXAxis
