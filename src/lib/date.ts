export function dateToRelativeTime(date: Date) {
	const now = new Date()
	const diff = now.getTime() - date.getTime()

	const DAY_IN_MS = 1000 * 60 * 60 * 24
	const diffInDays = diff / DAY_IN_MS
	if (diffInDays < 1) {
		return 'TODAY'
	}
	if (diffInDays < 7) {
		return 'THIS WEEK'
	}
	if (diffInDays < 30) {
		return 'THIS MONTH'
	}
	return 'OLDER'
}
