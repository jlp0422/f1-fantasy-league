const TickYAxis = ({ x, y, payload }) => {
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={6} textAnchor="end" fill="#fff" className="text-lg font-tertiary">
        {payload.value} pts
      </text>
    </g>
  )
}

export default TickYAxis
