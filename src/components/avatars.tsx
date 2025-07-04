import { Train, Anchor, Bird, Cat, Dog, Rabbit, Turtle, Bot } from 'lucide-react';
import type { ComponentType } from 'react';

export const AVATAR_CHOICES = [
  { id: 'avatar1', name: 'Train', Icon: Train },
  { id: 'avatar2', name: 'Anchor', Icon: Anchor },
  { id: 'avatar3', name: 'Bird', Icon: Bird },
  { id: 'avatar4', name: 'Cat', Icon: Cat },
  { id: 'avatar5', name: 'Dog', Icon: Dog },
  { id: 'avatar6', name: 'Rabbit', Icon: Rabbit },
  { id: 'avatar7', name: 'Turtle', Icon: Turtle },
];

export const BotAvatar = Bot;

const avatarMap: Record<string, ComponentType<{ className?: string }>> = AVATAR_CHOICES.reduce((acc, choice) => {
  acc[choice.id] = choice.Icon;
  return acc;
}, {} as Record<string, ComponentType<{ className?: string }>>);

export const getAvatar = (avatarId: string): ComponentType<{ className?: string }> => {
  return avatarMap[avatarId] || Train;
};
