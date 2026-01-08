import { apiFetch } from './api-fetch.js'

export function getDailyColor() {
  return apiFetch(`/v1/colors/daily`, 'GET').then(async (r) => {
    const text = await r.text()
    return text ? JSON.parse(text) : null
  })
}

export function getRandomColor() {
  return apiFetch(`/v1/colors/random`, 'GET').then(async (r) => {
    const text = await r.text()
    return text ? JSON.parse(text) : null
  })
}

export function submitScore(scoreData) {
  return apiFetch(`/v1/scores/submit`, 'POST', {
    submitted_color_r: scoreData.r,
    submitted_color_g: scoreData.g,
    submitted_color_b: scoreData.b,
  }).then(async (r) => {
    const text = await r.text()
    return text ? JSON.parse(text) : null
  })
}

export function getScoreHistory() {
  return apiFetch(`/v1/scores/history`, 'GET').then(async (r) => {
    const text = await r.text()
    return text ? JSON.parse(text) : null
  })
}
