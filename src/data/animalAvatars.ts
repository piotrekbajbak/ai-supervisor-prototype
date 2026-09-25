import fox from '../assets/avatars/avatar-fox.png'
import dog from '../assets/avatars/avatar-dog.png'
import koala from '../assets/avatars/avatar-koala.png'
import owl from '../assets/avatars/avatar-owl.png'
import cat from '../assets/avatars/avatar-cat.png'
import penguin from '../assets/avatars/avatar-penguin.png'
import rabbit from '../assets/avatars/avatar-rabbit.png'
import monkey from '../assets/avatars/avatar-monkey.png'

/** Professional cartoon animal face avatars (raster PNGs). */
export const animalAvatars = {
  fox,
  dog,
  koala,
  owl,
  cat,
  penguin,
  rabbit,
  monkey,
} as const

/** Agent profile avatar (Alex Morgan). */
export const agentAvatar = monkey

export type AnimalAvatar = keyof typeof animalAvatars
