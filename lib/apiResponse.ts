import { NextResponse } from 'next/server'

export function successResponse<T>(data: T, message?: string, status = 200) {
  return NextResponse.json({ success: true, message, data }, { status })
}

export function errorResponse(message: string, status = 400, errors?: unknown) {
  return NextResponse.json({ success: false, message, errors }, { status })
}

export function unauthorizedResponse(message = 'Unauthorized') {
  return NextResponse.json({ success: false, message }, { status: 401 })
}

export function forbiddenResponse(message = 'Forbidden: Insufficient permissions') {
  return NextResponse.json({ success: false, message }, { status: 403 })
}

export function notFoundResponse(message = 'Resource not found') {
  return NextResponse.json({ success: false, message }, { status: 404 })
}
