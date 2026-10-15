import type { EventDef } from '@/engine/events/schema';
import { CHILDHOOD_EVENTS } from './childhood';

/** All random events. Add a file per category and spread it here. */
export const EVENTS: readonly EventDef[] = [...CHILDHOOD_EVENTS];
