import { getUserToken } from '../session/session.js'

const DEFAULT_API = process.env.API_URL

export const Methods = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
}

export async function apiFetch(path, method, body = null, API = DEFAULT_API) {
  const options = {
    method,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${getUserToken() || ''}`,
    },
    credentials: 'include', // Include cookies in requests
  }

  if (body) options['body'] = JSON.stringify(body)

  const res = await fetch(API + path, options)
  if (res.ok) {
    return res
  } else {
    // Try to parse error response, but handle empty responses
    let errorMessage = res.statusText
    try {
      const text = await res.text()
      if (text) {
        const errorData = JSON.parse(text)
        // API returns 'description' field in error responses
        errorMessage = errorData.description || errorData.message || errorMessage
      }
    } catch (e) {
      // Ignore JSON parse errors for error responses
    }
    
    throw {
      message: errorMessage,
      res,
    }
  }
}
