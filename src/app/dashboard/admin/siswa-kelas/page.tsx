import { AdminModulePage } from "@/components/admin/AdminModulePage";

export default async function AdminStudentsAndClassesPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string | string[] }>;
}) {
  const requestedClass = (await searchParams).class;
  return (
    <AdminModulePage
      section="siswa-kelas"
      initialAdminClass={
        typeof requestedClass === "string" ? requestedClass : "1A"
      }
    />
  );
}
