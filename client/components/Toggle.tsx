interface Props {
  checked: boolean
  onChange: () => void
  label: string
  className?: string
}

const Toggle = ({ checked, onChange, label, className }: Props) => {
  return (
    <label
      className={`relative inline-flex items-center cursor-pointer ${className}`}
    >
      <input
        type='checkbox'
        checked={checked}
        className='sr-only peer'
        onChange={onChange}
      />
      <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EB3223]"></div>
      <span className='ml-2 font-bold uppercase text-base font-secondary'>
        {label}
      </span>
    </label>
  )
}

export default Toggle
