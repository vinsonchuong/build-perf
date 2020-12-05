import {createElement as e, useRef, Fragment} from 'react'
import {Canvas, useFrame} from 'react-three-fiber'

function Box({position}) {
  const mesh = useRef()

  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y += 0.01
  })

  return (
    e('mesh', {position, ref: mesh, scale: [1, 1, 1]},
      e('boxBufferGeometry', {args: [1, 1, 1]}, null),
      e('meshStandardMaterial', {color: 'orange'}, null)
    )
  )
}

export default function() {
  return e(Fragment, null,
    e(Canvas, null,
      e('ambientLight', null, null),
      e('pointLight', {position: [10, 10, 10]}, null),
      e(Box, {position: [-1.2, 0, 0]}, null),
      e(Box, {position: [1.2, 0, 0]}, null)
    ),
    e('span', null, 'Hello World!')
  )
}
