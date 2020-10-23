import sourcegraph from 'sourcegraph'

interface CurrentUserResponse {
    data?: {
        currentUser?: {
            username: string
            email: string
        }
    }
    errors?: string[]
}

export async function getCurrentUser(): Promise<{ username: string; email: string } | undefined> {
    const response = await sourcegraph.commands.executeCommand<CurrentUserResponse>(
        'queryGraphQL',
        `{
        currentUser {
          username, email
        }
      }`
    )
    return response?.data?.currentUser
}
