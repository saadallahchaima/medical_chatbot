import { motion } from 'framer-motion'

export default function MedicalChatbotIcon({ size = 'lg', animate = true }) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-40 h-40',
    '2xl': 'w-52 h-52',
  }

  const scale = {
    sm: 0.5,
    md: 0.75,
    lg: 1,
    xl: 1.25,
    '2xl': 1.6,
  }

  const s = scale[size] || 1

  return (
    <motion.div
      className={`relative ${sizeClasses[size] || sizeClasses.lg} flex items-center justify-center`}
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={animate ? { scale: 1, opacity: 1 } : false}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Outer glow halo */}
      <div
        className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-pulse-soft"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.4) 0%, rgba(20,184,166,0.15) 50%, transparent 70%)',
          transform: `scale(${1.4 * s})`,
        }}
      />

      {/* Secondary glow ring */}
      <div
        className="absolute rounded-full border-2 border-emerald-300/30 animate-ping"
        style={{
          width: `${120 * s}px`,
          height: `${120 * s}px`,
          animationDuration: '3s',
        }}
      />

      {/* Main 3D sphere container */}
      <div
        className="relative"
        style={{
          width: `${80 * s}px`,
          height: `${80 * s}px`,
          transformStyle: 'preserve-3d',
          perspective: '600px',
        }}
      >
        {/* Floating animation wrapper */}
        <motion.div
          className="w-full h-full"
          animate={animate ? {
            y: [0, -8, 0],
            rotateX: [0, 5, 0, -5, 0],
            rotateY: [0, 8, 0, -8, 0],
          } : {}}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Main body sphere — back layer for depth */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(145deg, #047857 0%, #059669 40%, #10b981 70%, #34d399 100%)',
              boxShadow: `
                inset -8px -8px 20px rgba(0,0,0,0.2),
                inset 8px 8px 20px rgba(255,255,255,0.3),
                0 20px 40px rgba(16,185,129,0.3),
                0 0 60px rgba(16,185,129,0.15)
              `,
              transform: 'translateZ(0px)',
            }}
          />

          {/* Highlight reflection — top-left */}
          <div
            className="absolute rounded-full"
            style={{
              width: `${50 * s}px`,
              height: `${35 * s}px`,
              top: `${8 * s}px`,
              left: `${12 * s}px`,
              background: 'radial-gradient(ellipse at 30% 30%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 50%, transparent 70%)',
              filter: 'blur(2px)',
              transform: 'translateZ(8px) rotateX(-20deg)',
            }}
          />

          {/* Bot face container */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={{ transform: 'translateZ(12px)' }}
          >
            {/* Eyes container */}
            <div className="flex gap-3 mb-1" style={{ gap: `${12 * s}px` }}>
              {/* Left eye */}
              <div
                className="rounded-full bg-white shadow-inner relative overflow-hidden"
                style={{
                  width: `${18 * s}px`,
                  height: `${22 * s}px`,
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  className="absolute rounded-full bg-slate-800"
                  style={{
                    width: `${10 * s}px`,
                    height: `${12 * s}px`,
                    top: `${5 * s}px`,
                    left: `${4 * s}px`,
                  }}
                >
                  <div
                    className="absolute rounded-full bg-white"
                    style={{
                      width: `${3 * s}px`,
                      height: `${3 * s}px`,
                      top: `${2 * s}px`,
                      right: `${1 * s}px`,
                    }}
                  />
                </div>
              </div>

              {/* Right eye */}
              <div
                className="rounded-full bg-white shadow-inner relative overflow-hidden"
                style={{
                  width: `${18 * s}px`,
                  height: `${22 * s}px`,
                  boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  className="absolute rounded-full bg-slate-800"
                  style={{
                    width: `${10 * s}px`,
                    height: `${12 * s}px`,
                    top: `${5 * s}px`,
                    left: `${4 * s}px`,
                  }}
                >
                  <div
                    className="absolute rounded-full bg-white"
                    style={{
                      width: `${3 * s}px`,
                      height: `${3 * s}px`,
                      top: `${2 * s}px`,
                      right: `${1 * s}px`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Friendly smile */}
            <div
              className="relative"
              style={{
                width: `${24 * s}px`,
                height: `${10 * s}px`,
                marginTop: `${2 * s}px`,
              }}
            >
              <svg
                width={24 * s}
                height={10 * s}
                viewBox="0 0 24 10"
                fill="none"
              >
                <path
                  d="M2 2C2 2 6 8 12 8C18 8 22 2 22 2"
                  stroke="white"
                  strokeWidth={2.5 * s}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
                />
              </svg>
            </div>

            {/* Medical cross on forehead */}
            <div
              className="absolute flex items-center justify-center"
              style={{
                top: `${6 * s}px`,
                width: `${14 * s}px`,
                height: `${14 * s}px`,
              }}
            >
              <svg
                width={14 * s}
                height={14 * s}
                viewBox="0 0 14 14"
                fill="none"
              >
                <rect
                  x="5"
                  y="1"
                  width="4"
                  height="12"
                  rx="1"
                  fill="white"
                  fillOpacity="0.9"
                />
                <rect
                  x="1"
                  y="5"
                  width="12"
                  height="4"
                  rx="1"
                  fill="white"
                  fillOpacity="0.9"
                />
              </svg>
            </div>
          </div>

          {/* Stethoscope — left ear piece */}
          <div
            className="absolute"
            style={{
              width: `${8 * s}px`,
              height: `${8 * s}px`,
              top: `${18 * s}px`,
              left: `${-6 * s}px`,
              background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)',
              borderRadius: '50%',
              boxShadow: '2px 2px 6px rgba(0,0,0,0.2), inset -1px -1px 2px rgba(0,0,0,0.1)',
              transform: 'translateZ(6px)',
            }}
          />

          {/* Stethoscope — right ear piece */}
          <div
            className="absolute"
            style={{
              width: `${8 * s}px`,
              height: `${8 * s}px`,
              top: `${18 * s}px`,
              right: `${-6 * s}px`,
              background: 'linear-gradient(145deg, #e2e8f0, #cbd5e1)',
              borderRadius: '50%',
              boxShadow: '-2px 2px 6px rgba(0,0,0,0.2), inset -1px -1px 2px rgba(0,0,0,0.1)',
              transform: 'translateZ(6px)',
            }}
          />

          {/* Stethoscope — tube curve */}
          <svg
            className="absolute"
            style={{
              width: `${100 * s}px`,
              height: `${60 * s}px`,
              top: `${20 * s}px`,
              left: `${-10 * s}px`,
              transform: 'translateZ(4px)',
              pointerEvents: 'none',
            }}
            viewBox="0 0 100 60"
            fill="none"
          >
            <path
              d="M10 10 C10 40, 30 50, 50 50 C70 50, 90 40, 90 10"
              stroke="url(#tubeGradient)"
              strokeWidth={3 * s}
              strokeLinecap="round"
              fill="none"
              style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.2))' }}
            />
            <defs>
              <linearGradient id="tubeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="50%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Stethoscope — chest piece */}
          <div
            className="absolute"
            style={{
              width: `${16 * s}px`,
              height: `${16 * s}px`,
              bottom: `${-4 * s}px`,
              left: '50%',
              marginLeft: `${-8 * s}px`,
              background: 'radial-gradient(circle at 35% 35%, #e2e8f0, #94a3b8)',
              borderRadius: '50%',
              boxShadow: `
                inset -2px -2px 4px rgba(0,0,0,0.2),
                inset 2px 2px 4px rgba(255,255,255,0.5),
                0 4px 8px rgba(0,0,0,0.2)
              `,
              transform: 'translateZ(8px)',
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: `${10 * s}px`,
                height: `${10 * s}px`,
                top: '50%',
                left: '50%',
                marginTop: `${-5 * s}px`,
                marginLeft: `${-5 * s}px`,
                background: 'radial-gradient(circle at 30% 30%, #f1f5f9, #cbd5e1)',
                boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
              }}
            />
          </div>

          {/* Antenna */}
          <div
            className="absolute"
            style={{
              width: `${3 * s}px`,
              height: `${14 * s}px`,
              top: `${-10 * s}px`,
              left: '50%',
              marginLeft: `${-1.5 * s}px`,
              background: 'linear-gradient(180deg, #94a3b8, #cbd5e1)',
              borderRadius: `${2 * s}px`,
              transform: 'translateZ(4px)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
            }}
          >
            <div
              className="absolute rounded-full"
              style={{
                width: `${8 * s}px`,
                height: `${8 * s}px`,
                top: `${-6 * s}px`,
                left: '50%',
                marginLeft: `${-4 * s}px`,
                background: 'radial-gradient(circle at 35% 35%, #34d399, #10b981)',
                boxShadow: '0 0 8px rgba(52,211,153,0.5), inset -1px -1px 2px rgba(0,0,0,0.1)',
              }}
            />
          </div>
        </motion.div>
      </div>

      {/* Orbiting particles */}
      {animate && (
        <>
          <motion.div
            className="absolute rounded-full bg-emerald-400/40"
            style={{
              width: `${6 * s}px`,
              height: `${6 * s}px`,
            }}
            animate={{
              x: [0, 60 * s, 0, -60 * s, 0],
              y: [-60 * s, 0, 60 * s, 0, -60 * s],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
          <motion.div
            className="absolute rounded-full bg-teal-400/30"
            style={{
              width: `${4 * s}px`,
              height: `${4 * s}px`,
            }}
            animate={{
              x: [0, -40 * s, 0, 40 * s, 0],
              y: [40 * s, 0, -40 * s, 0, 40 * s],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
              delay: 1,
            }}
          />
          <motion.div
            className="absolute rounded-full bg-emerald-300/25"
            style={{
              width: `${8 * s}px`,
              height: `${8 * s}px`,
            }}
            animate={{
              x: [0, 50 * s, 30 * s, -20 * s, 0],
              y: [-30 * s, 20 * s, -50 * s, 40 * s, -30 * s],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </>
      )}
    </motion.div>
  )
}

