import sourcegraph from 'sourcegraph'

export async function getCurrentUser(): Promise<{ username: string; email: string }> {
    const response = await sourcegraph.commands.executeCommand(
        'queryGraphQL',
        `{
        currentUser {
          username, email
        }
      }`
    )
    return response?.data?.currentUser
}
