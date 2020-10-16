import sourcegraph from 'sourcegraph'

export async function getCurrentUser(): Promise<{username: string, email: string}> {
    const response = await sourcegraph.commands.executeCommand(
        'queryGraphQL',
        `{
        currentUser {
          username, email
        }
      }`
    )
    console.log('A response is going to the extension', response.data)
    return response?.data?.currentUser
}
