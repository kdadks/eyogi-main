'use client'

import { useEffect, useRef, useState } from 'react'
import Matter, { Body } from 'matter-js'
import { Facebook, Linkedin, Twitter, Youtube } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const LINKS = [
  {
    name: 'Forms',
    href: '/forms',
  },
  {
    name: 'Membership',
    href: '/membership',
  },
  {
    name: 'Blogs',
    href: '/blogs',
  },

  {
    name: 'FAQ',
    href: '/faq',
  },
  {
    name: 'Donation',
    href: '/donation',
  },
  {
    name: 'Privacy Policy',
    href: '/privacy-policy',
  },
]

const texts = ['INTEGRITY', 'COMMITMENT', 'TRANSPARENCY', 'TRUST', 'SPIRITUALITY', 'GURUKUL']
const colors = [
  '#fb923c',
  '#f99039',
  '#f77e36',
  '#f66c33',
  '#f45a30',
  '#f2482d',
  '#f1362a',
  '#f02427',
  '#ef111f',
  '#dc2626',
]

export default function Footer() {
  const sceneRef = useRef<HTMLDivElement | null>(null)
  const renderRef = useRef<Matter.Render>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const updateSize = () => {
    if (sceneRef.current) {
      const { width, height } = sceneRef.current.getBoundingClientRect()
      setDimensions({ width, height })

      const render = renderRef.current
      if (!render) return

      render.bounds.max.x = width
      render.bounds.max.y = height
      render.options.width = width
      render.options.height = height
      render.canvas.width = width
      render.canvas.height = height
      Matter.Render.setPixelRatio(render, window.devicePixelRatio)
    }
  }

  useEffect(() => {
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    if (!sceneRef.current || dimensions.width === 0 || dimensions.height === 0) return

    const Engine = Matter.Engine
    const Render = Matter.Render
    const Runner = Matter.Runner
    const Composites = Matter.Composites
    const MouseConstraint = Matter.MouseConstraint
    const Mouse = Matter.Mouse
    const Composite = Matter.Composite
    const Bodies = Matter.Bodies
    const Events = Matter.Events

    const engine = Engine.create()
    const world = engine.world

    engine.gravity.y = 0.05
    engine.gravity.scale = 0.001

    const render = Render.create({
      element: sceneRef.current,
      engine: engine,
      options: {
        width: dimensions.width,
        height: dimensions.height,
        showAngleIndicator: false,
        wireframes: false,
        background: 'transparent',
      },
    })

    renderRef.current = render

    Render.run(render)
    const runner = Runner.create()
    Runner.run(runner, engine)

    const getTextWidth = (text: string, context: CanvasRenderingContext2D) => {
      context.font = '700 20px Arial'
      return context.measureText(text).width
    }

    const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)]

    const stack = Composites.stack(0, 0, 6, 1, 0, 0, (x: number, y: number, index: number) => {
      const randomX = Math.round(Math.random() * (dimensions.width - 300)) + 150
      const randomY = Math.round(Math.random() * (dimensions.height - 300)) + 150
      const text = texts[index]
      const randomColor = getRandomColor()
      const textWidth = getTextWidth(text, render.context)
      const rectangle = Bodies.rectangle(randomX, randomY, textWidth + 25, 50, {
        timeScale: 0.75,
        label: 'Box',
        angle: Math.floor(Math.random() * 91) - 45,
        chamfer: { radius: 12 },
        restitution: 0.9,
        render: {
          fillStyle: randomColor,
        },
      })
      return rectangle
    })

    const stackBalls = Composites.stack(0, 50, 5, 1, 0, 0, () => {
      const randomX = Math.round(Math.random() * (dimensions.width - 100)) + 50
      const randomY = Math.round(Math.random() * (dimensions.height - 100)) + 50
      const randomColor = getRandomColor()
      const rectangle = Bodies.circle(randomX, randomY, 25, {
        timeScale: 0.75,
        label: 'Box ',
        mass: 10,
        inverseMass: 1 / 10,
        restitution: 0.9,
        render: {
          fillStyle: randomColor,
        },
      })
      return rectangle
    })

    Composite.add(world, stack)
    Composite.add(world, stackBalls)

    Composite.add(world, [
      Bodies.polygon(50, 50, 3, 50, {
        restitution: 0.9,
        timeScale: 0.75,
        label: 'Box ',

        render: {
          fillStyle: getRandomColor(),
        },
      }),
    ])

    // Add static boundaries
    Composite.add(world, [
      Bodies.rectangle(dimensions.width / 2, 0, dimensions.width, 1, {
        isStatic: true,
        restitution: 1,
        render: {
          fillStyle: '#ffffff',
        },
      }),
      Bodies.rectangle(dimensions.width / 2, dimensions.height, dimensions.width, 1, {
        isStatic: true,
        restitution: 1,
        render: {
          fillStyle: '#ffffff',
        },
      }),
      Bodies.rectangle(dimensions.width, dimensions.height / 2, 1, dimensions.height, {
        isStatic: true,
        restitution: 1,
        render: {
          fillStyle: '#ffffff',
        },
      }),
      Bodies.rectangle(0, dimensions.height / 2, 1, dimensions.height, {
        isStatic: true,
        restitution: 1,
        render: {
          fillStyle: '#ffffff',
        },
      }),
    ])

    const cachedForces: { body: Matter.Body; force: Matter.Vector; torque: number }[] = []

    Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach(({ bodyA, bodyB, collision }) => {
        const box = bodyA.label.startsWith('Box')
          ? bodyA
          : bodyB.label.startsWith('Box')
            ? bodyB
            : null
        const border = bodyA.isStatic ? bodyA : bodyB.isStatic ? bodyB : null

        if (box && border) {
          const contactX = collision.supports[0].x
          const contactY = collision.supports[0].y
          const boxCenterX = box.position.x
          const boxCenterY = box.position.y
          let forceX = 0
          let forceY = 0
          const torque = Matter.Common.random(-0.03, 0.03)
          if (contactX < boxCenterX && Math.abs(contactX - box.bounds.min.x) < 5) {
            // **Left wall hit → Push right**
            forceX = Matter.Common.random(0.06, 0.1)
          } else if (contactX > boxCenterX && Math.abs(contactX - box.bounds.max.x) < 5) {
            // **Right wall hit → Push left**
            forceX = Matter.Common.random(-0.03, -0.1)
          }
          if (contactY < boxCenterY && Math.abs(contactY - box.bounds.min.y) < 5) {
            // **Top wall hit → Push down**
            forceY = Matter.Common.random(0.04, 0.08)
          } else if (contactY > boxCenterY && Math.abs(contactY - box.bounds.max.y) < 5) {
            // **Bottom wall hit → Push up**
            forceY = Matter.Common.random(-0.08, -0.12)
          }

          cachedForces.push({ body: box, force: { x: forceX, y: forceY }, torque })
        }
      })
    })

    Events.on(engine, 'beforeUpdate', () => {
      cachedForces.forEach(({ body, force, torque }) => {
        Body.applyForce(body, body.position, force)
        Body.setAngularVelocity(body, body.angularVelocity + torque)
      })
      cachedForces.length = 0
    })

    const mouse = Mouse.create(render.canvas)
    const mouseConstraint = MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.2, render: { visible: false } },
    })
    Composite.add(world, mouseConstraint)
    render.mouse = mouse

    const renderTextOnRectangles = () => {
      const context = render.context
      context.font = '700 24px Arial'
      context.fillStyle = 'white'
      let index = 0
      Composite.allBodies(world).forEach((body) => {
        if (body.label === 'Box' && body.id !== 15) {
          const angle = body.angle
          const { x, y } = body.position
          const text = texts[index++]
          const textWidth = getTextWidth(text, context)

          context.save()
          context.translate(x, y)
          context.rotate(angle)
          context.fillText(text, -textWidth / 2, 8)
          context.restore()
        }
      })
    }

    const update = () => {
      renderTextOnRectangles()
      Matter.Engine.update(engine)
      requestAnimationFrame(update)
    }
    update()

    Render.lookAt(render, {
      min: { x: 0, y: 0 },
      max: { x: dimensions.width, y: dimensions.height },
    })

    return () => {
      Matter.Render.stop(render)
      Matter.Runner.stop(runner)
      Composite.clear(world, false)
      Engine.clear(engine)

      if (sceneRef.current) {
        sceneRef.current.innerHTML = ''
      }
      // Clear the render reference
      renderRef.current = null
    }
  }, [dimensions])

  return (
    <footer
      className="relative bg-white w-full h-[700px] min-[350px]:h-[600px] sm:h-[500px] lg:h-[700px]"
      style={{ clipPath: 'polygon(0% 0, 100% 0%, 100% 100%, 0 100%)' }}
    >
      <div className="fixed bottom-0 h-[700px] min-[350px]:h-[600px] sm:h-[500px] lg:h-[700px] w-full text-black p-4 lg:p-8 flex flex-col justify-end lg:grid grid-cols-2 gap-4">
        <div className="lg:col-span-2 flex justify-between py-2 sm:py-8 sm:px-[5vw]">
          <p className="text-[clamp(1.25rem,2.5vw,2.5vw)] col-span-2 md:max-w-[63vw]">
            Blending{' '}
            <span className="font-semibold bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent py-4">
              Science
            </span>{' '}
            & <span className="font-vibes">Spirituality.</span> <br className="hidden sm:block" />{' '}
            Discover ancient wisdom through modern education.
          </p>

          <div className="relative hidden justify-start aspect-square w-[8vw] h-[8vw] md:flex max-w-[180px] max-h-[180px]">
            <Image src={'/eyogiTextLess.png'} alt={'eyogi Gurukul'} fill className="rounded-full" />
          </div>
        </div>

        <div className="sm:grid-cols-[1fr,.4fr] grid gap-4 lg:gap-x-8 bg-orange-50 rounded-2xl px-[5vw] py-4 sm:py-8">
          <div className="flex flex-col">
            <p className="text-base lg:text-xl font-medium pb-2 uppercase">Charity details:</p>
            <p>IBAN: IE92AIBK93123324399060</p>
            <p>BIC: AIBKIE2DXXX</p>
            <p>Account Name: eYogi Gurukul</p>
            <p>Bank: AIB Ireland</p>
            <p>Registered Charity Number: 20205851</p>
            <p>eyogiurukul@gmail.com</p>
          </div>
          <div className="flex flex-col">
            <p className="text-base lg:text-xl font-medium pb-2 uppercase">Links:</p>
            {LINKS.map((link, index) => (
              <Link key={index} href={link.href} className="relative group block w-fit">
                {link.name}
                <div className="w-full absolute -bottom-[2px] left-0 h-0.5 flex justify-end group-hover:justify-start">
                  <div className="group-hover:w-full bg-black h-full w-0 transition-all duration-300" />
                </div>
              </Link>
            ))}
          </div>
          <div className="sm:col-span-2 sm:grid-cols-[1fr,.4fr] gap-4 sm:grid flex justify-between lg:items-end">
            <div className="flex items-center gap-4 lg:gap-6">
              <Link
                href="http://www.linkedin.com/in/eyogi-gurukul-7a63a91a0"
                className="hover:text-red-600 transition-colors duration-300 flex items-center"
              >
                <Linkedin className="w-5 h-5 lg:w-7 lg:h-7" />
              </Link>
              <Link
                href={'http://www.twitter.com/@eyogigurukul'}
                className="hover:text-red-600 transition-colors duration-300"
              >
                <Twitter className="w-5 h-5 lg:w-7 lg:h-7" />
              </Link>
              <Link
                href={'https://www.facebook.com/allfestivesireland#'}
                className="hover:text-red-600 transition-colors duration-300"
              >
                <Facebook className="w-5 h-5 lg:w-7 lg:h-7" />
              </Link>
              <Link
                href={'https://www.youtube.com/channel/UCTytB2My0xSvNmtKBRIJnIg?'}
                className="hover:text-red-600 transition-colors duration-300"
              >
                <Youtube className="w-5 h-5 lg:w-7 lg:h-7" />
              </Link>
            </div>
            <div className="gap-2">
              <p className="pl-1 lg:pl-2.5">©2025</p>
              <Link
                className=" hover:text-black/80 text-sm flex gap-1 pl-1 lg:pl-2.5 flex-wrap transition-colors duration-300 "
                href="https://www.bitshaft.pl"
              >
                Assembled by
                <span className="font-semibold font-anta">BITSHAFT</span>
              </Link>
            </div>
          </div>
        </div>
        <div className="w-full items-center justify-center  hidden lg:flex h-full">
          <div ref={sceneRef} className="w-full h-full bg-orange-50 rounded-3xl overflow-hidden" />
        </div>
      </div>
    </footer>
  )
}
