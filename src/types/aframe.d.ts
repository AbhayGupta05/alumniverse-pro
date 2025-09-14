declare namespace JSX {
  interface IntrinsicElements {
    'a-scene': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      ref?: React.Ref<HTMLElement>
      background?: string
      fog?: string
      'embedded'?: boolean
      'loading-screen'?: string
      'vr-mode-ui'?: string
      'device-orientation-permission-ui'?: string
    }, HTMLElement>

    'a-entity': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      position?: string
      rotation?: string
      scale?: string
      'networking-zone'?: string
      'presentation-screen'?: string
      'hand-tracking-controls'?: string
      'laser-controls'?: string
      'movement-controls'?: string
      'networking-avatar'?: string
      material?: string
      geometry?: string
      light?: string
      shadow?: boolean
      visible?: boolean
      'look-controls'?: string
      'wasd-controls'?: string
      animation?: string
    }, HTMLElement>

    'a-box': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      position?: string
      rotation?: string
      scale?: string
      material?: string
      geometry?: string
      color?: string
      shadow?: boolean
      width?: string | number
      height?: string | number
      depth?: string | number
    }, HTMLElement>

    'a-sphere': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      position?: string
      rotation?: string
      scale?: string
      material?: string
      color?: string
      radius?: string | number
      shadow?: boolean
    }, HTMLElement>

    'a-plane': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      position?: string
      rotation?: string
      scale?: string
      material?: string
      color?: string
      width?: string | number
      height?: string | number
      repeat?: string
      shadow?: boolean
      src?: string
    }, HTMLElement>

    'a-sky': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      color?: string
      src?: string
      material?: string
    }, HTMLElement>

    'a-light': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      type?: string
      color?: string
      intensity?: string | number
      position?: string
      angle?: string | number
      'cast-shadow'?: boolean
    }, HTMLElement>

    'a-camera': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      position?: string
      rotation?: string
      'look-controls'?: string
      'wasd-controls'?: string
      cursor?: string
      'user-height'?: string | number
    }, HTMLElement>

    'a-cursor': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      position?: string
      geometry?: string
      material?: string
      'raycaster'?: string
    }, HTMLElement>

    'a-text': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      value?: string
      position?: string
      rotation?: string
      scale?: string
      color?: string
      align?: string
      'font-size'?: string | number
      'wrap-count'?: string | number
      shader?: string
    }, HTMLElement>

    'a-sound': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      src?: string
      autoplay?: boolean
      loop?: boolean
      volume?: string | number
      'distance-model'?: string
      'max-distance'?: string | number
      'reference-distance'?: string | number
    }, HTMLElement>

    'a-assets': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>

    'a-asset-item': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      id?: string
      src?: string
    }, HTMLElement>

    'a-image': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      src?: string
      position?: string
      rotation?: string
      scale?: string
      width?: string | number
      height?: string | number
    }, HTMLElement>

    'a-video': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
      src?: string
      position?: string
      rotation?: string
      scale?: string
      width?: string | number
      height?: string | number
      autoplay?: boolean
      loop?: boolean
    }, HTMLElement>
  }
}