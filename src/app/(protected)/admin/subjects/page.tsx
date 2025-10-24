import { AdminOnly } from '@/components/Guard'
import TopBar from '@/components/admin/TopBar'
import TabBarMobile from '@/components/admin/TabBarMobile'
import SubjectsClient from './SubjectsClient'
import { listTenantClassroomsForSelect } from '@/lib/actions/admin/classrooms'
import { listSubjects } from '@/lib/actions/admin/subjects'

export const dynamic = 'force-dynamic'

const mobileTabs = [
  { href: '/admin', label: 'Dashboard', icon: <span>📊</span> },
  { href: '/admin/institutes', label: 'Institutes', icon: <span>🏛️</span> },
  { href: '/admin/classrooms', label: 'Classrooms', icon: <span>🏫</span> },
  { href: '/admin/subjects', label: 'Subjects', icon: <span>📚</span> },
  { href: '/admin/lessons', label: 'Lessons', icon: <span>🎓</span> },
]

export default async function AdminSubjectsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const classrooms = await listTenantClassroomsForSelect()

  const selectedClassroomParam = Array.isArray(searchParams.classroom)
    ? searchParams.classroom[0]
    : searchParams.classroom ?? classrooms[0]?.id

  const selectedClassroom = classrooms.find((room) => room.id === selectedClassroomParam) ?? classrooms[0]

  const subjects = selectedClassroom ? await listSubjects(selectedClassroom.id) : []

  const content = await AdminOnly({
    children: (
      <main className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 pb-20 md:px-8">
        <TopBar
          title="Subjects"
          subtitle="Organise the curriculum by classroom, set publishing status, and manage lesson ordering."
        />
        <TabBarMobile tabs={mobileTabs} />

        <FilterBar classrooms={classrooms} selectedId={selectedClassroom?.id ?? ''} />

        {selectedClassroom ? (
          <SubjectsClient
            classroomId={selectedClassroom.id}
            classroomName={selectedClassroom.title}
            subjects={subjects}
          />
        ) : (
          <p className="rounded-2xl border border-purple-800/40 bg-[#0b0615] p-6 text-sm text-purple-200">
            No classrooms available. Create a classroom first.
          </p>
        )}
      </main>
    ),
  })

  if (!content) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-16 text-purple-100">
        <h1 className="text-2xl font-semibold">Access restricted</h1>
        <p className="text-sm text-purple-200">Switch to admin view or request elevated permissions to manage subjects.</p>
      </main>
    )
  }

  return content
}

function FilterBar({
  classrooms,
  selectedId,
}: {
  classrooms: Array<{ id: string; title: string }>
  selectedId: string
}) {
  return (
    <form className="flex flex-col gap-4 rounded-2xl border border-purple-800/40 bg-[#0b0615] p-4 text-purple-100 shadow-[0_18px_45px_-28px_rgba(109,40,217,0.6)] md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <label className="text-xs uppercase tracking-wide text-purple-300">Classroom</label>
        <select
          name="classroom"
          defaultValue={selectedId}
          className="rounded-full border border-purple-700/40 bg-transparent px-4 py-2 text-sm text-white focus:border-purple-400 focus:outline-none"
        >
          {classrooms.map((room) => (
            <option key={room.id} value={room.id} className="bg-[#0b0615]">
              {room.title}
            </option>
          ))}
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
