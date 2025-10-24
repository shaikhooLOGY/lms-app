import { AdminOnly } from '@/components/Guard'
import TopBar from '@/components/admin/TopBar'
import TabBarMobile from '@/components/admin/TabBarMobile'
import LessonsClient from './LessonsClient'
import { listTenantClassroomsForSelect } from '@/lib/actions/admin/classrooms'
import { listSubjectsForSelect } from '@/lib/actions/admin/subjects'
import { listLessons } from '@/lib/actions/admin/lessons'
import { requireSession } from '@/lib/auth/requireSession'

export const dynamic = 'force-dynamic'

const mobileTabs = [
  { href: '/admin', label: 'Dashboard', icon: <span>📊</span> },
  { href: '/admin/institutes', label: 'Institutes', icon: <span>🏛️</span> },
  { href: '/admin/classrooms', label: 'Classrooms', icon: <span>🏫</span> },
  { href: '/admin/subjects', label: 'Subjects', icon: <span>📚</span> },
  { href: '/admin/lessons', label: 'Lessons', icon: <span>🎓</span> },
]

export default async function AdminLessonsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  await requireSession('/admin/lessons')
  const classrooms = await listTenantClassroomsForSelect()
  const classroomIdParam = Array.isArray(searchParams.classroom)
    ? searchParams.classroom[0]
    : searchParams.classroom ?? classrooms[0]?.id

  const selectedClassroom = classrooms.find((room) => room.id === classroomIdParam) ?? classrooms[0]

  const subjects = selectedClassroom ? await listSubjectsForSelect(selectedClassroom.id) : []
  const subjectIdParam = Array.isArray(searchParams.subject)
    ? searchParams.subject[0]
    : searchParams.subject ?? subjects[0]?.id

  const selectedSubject = subjects.find((subject) => subject.id === subjectIdParam) ?? subjects[0]

  const lessons = selectedSubject ? await listLessons(selectedSubject.id) : []

  const content = await AdminOnly({
    children: (
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 pb-20 md:px-8">
        <TopBar title="Lessons" subtitle="Author and curate lesson content with previews and ordering controls." />
        <TabBarMobile tabs={mobileTabs} />

        <FilterBar
          classrooms={classrooms}
          subjects={subjects}
          selectedClassroomId={selectedClassroom?.id ?? ''}
          selectedSubjectId={selectedSubject?.id ?? ''}
        />

        {selectedSubject ? (
          <LessonsClient subjectId={selectedSubject.id} subjectTitle={selectedSubject.title} lessons={lessons} />
        ) : (
          <p className="rounded-2xl border border-purple-800/40 bg-[#0b0615] p-6 text-sm text-purple-200">
            Choose a classroom and subject to begin managing lessons.
          </p>
        )}
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-purple-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-purple-200">Switch to admin view or request elevated permissions to manage lessons.</p>
      </main>
    )
  }

  return content
}

function FilterBar({
  classrooms,
  subjects,
  selectedClassroomId,
  selectedSubjectId,
}: {
  classrooms: Array<{ id: string; title: string }>
  subjects: Array<{ id: string; title: string }>
  selectedClassroomId: string
  selectedSubjectId: string
}) {
  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-purple-800/40 bg-[#0b0615] p-4 text-purple-100 shadow-[0_18px_45px_-28px_rgba(109,40,217,0.6)] md:flex-row md:items-end md:justify-between">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <label className="text-xs uppercase tracking-wide text-purple-300">Classroom</label>
        <select
          name="classroom"
          defaultValue={selectedClassroomId}
          className="rounded-full border border-purple-700/40 bg-transparent px-4 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
        >
          {classrooms.map((room) => (
            <option key={room.id} value={room.id} className="bg-[#0b0615]">
              {room.title}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <label className="text-xs uppercase tracking-wide text-purple-300">Subject</label>
        <select
          name="subject"
          defaultValue={selectedSubjectId}
          className="rounded-full border border-purple-700/40 bg-transparent px-4 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
        >
          {subjects.length === 0 ? (
            <option value="" className="bg-[#0b0615]">
              No subjects
            </option>
          ) : (
            subjects.map((subject) => (
              <option key={subject.id} value={subject.id} className="bg-[#0b0615]">
                {subject.title}
              </option>
            ))
          )}
        </select>
      </div>
      <button
        type="submit"
        className="rounded-full border border-purple-700/40 px-4 py-2 text-xs uppercase tracking-wide text-purple-200 hover:border-purple-500 hover:text-white"
      >
        Apply
      </button>
    </form>
  )
}
