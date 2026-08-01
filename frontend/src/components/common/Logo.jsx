import logoImg from '../../assets/logo.png'

export default function Logo({ size = 'md', showText = false, className = '' }) {
  const sizes = {
    xs:   'h-8 w-8',
    sm:   'h-10 w-10',
    md:   'h-12 w-12',
    lg:   'h-16 w-16',
    xl:   'h-24 w-24',
    full: 'h-32 w-auto',
  }

  if (size === 'full') {
    return (
      <img
        src={logoImg}
        alt="SunuTribunal Logo"
        className={sizes.full + ' object-contain ' + className}
      />
    )
  }

  return (
    <div className={'flex items-center gap-3 ' + className}>
      <img
        src={logoImg}
        alt="SunuTribunal"
        className={sizes[size] + ' object-contain rounded-xl'}
      />
      {showText && (
        <div>
          <div className="font-display font-bold text-navy-700 leading-none">
            <span className="text-navy-700">Sunu</span>
            <span className="text-gold-400">Tribunal</span>
          </div>
          <div className="text-xs text-gray-400 tracking-widest uppercase mt-0.5">
            Justice Digitale
          </div>
        </div>
      )}
    </div>
  )
}