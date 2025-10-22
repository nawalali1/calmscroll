import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const err = url.searchParams.get("error_description");
  if (err) {
    return NextResponse.redirect(
      new URL("/?auth_error=" + encodeURIComponent(err), req.url)
    );
  }
  return NextResponse.redirect(new URL("/", req.url));
}
