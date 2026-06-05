import { NextRequest } from "next/server";
import {
  deleteSchoolStudent,
  getSchoolStudentById,
  updateSchoolStudent
} from "@/lib/school";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return getSchoolStudentById(params.id, _req);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return updateSchoolStudent(params.id, req);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return deleteSchoolStudent(params.id, _req);
}
