import { classroomStatusEnum } from '@/lib/validators/classroom'

export const classroomStatuses = ['all', ...classroomStatusEnum.options] as const
export type ClassroomStatusFilter = (typeof classroomStatuses)[number]
