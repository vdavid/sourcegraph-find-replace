import { Subscription } from 'rxjs'
import * as sourcegraph from 'sourcegraph'
import { evaluateAndCreateCampaignSpec } from '@sourcegraph/campaigns-client'
import slugify from 'slugify'
import { getCurrentUser } from './util'

// TODO: sanitize this for real, it gets used in the description of the campaign
const escapedMarkdownCode = (text: string): string => '`' + text.replace(/`/g, '\\`') + '`'

// TODO: instead of using fileFilter, use the search results as the list of matching files
const fileFilter = (path: string): boolean => path.endsWith('.yaml') || path.endsWith('.yml') || path.endsWith('.md')

export const registerFindReplaceAction = (): Subscription => {
    const subscription = new Subscription()
    subscription.add(
        sourcegraph.commands.registerCommand('start-find-replace', async (searchQuery: string) => {
            // TODO: in the future, use the search query to get the list of matching files.
            console.log('context.searchQuery', searchQuery)

            // To create campaigns, a namespace is used, which can be the current user's username.
            const currentUser = await getCurrentUser()
            const namespaceName = currentUser?.username
            console.log('currentUser', currentUser)

            const match = await sourcegraph.app.activeWindow!.showInputBox({
                prompt: 'Find all matches of:',
            })
            if (!match) {
                return
            }

            const replacement = await sourcegraph.app.activeWindow!.showInputBox({
                prompt: 'Replace with:',
            })
            // Empty string is a valid replacement, so compare directly with undefined.
            if (replacement === undefined) {
                return
            }

            const name = `replace-${slugify(match)}-with-${slugify(replacement)}`
            const description = `Replace ${escapedMarkdownCode(match)} with ${escapedMarkdownCode(replacement)}`

            let percentage = 0
            const { applyURL, diffStat } = await sourcegraph.app.activeWindow!.withProgress(
                { title: '**Find-replace**' },
                async reporter =>
                    evaluateAndCreateCampaignSpec(namespaceName, {
                        name,
                        on: [
                            {
                                repositoriesMatchingQuery: match,
                            },
                        ],
                        description,
                        steps: [
                            {
                                fileFilter,
                                editFile: (path, text) => {
                                    if (!text.includes(match)) {
                                        return null
                                    }

                                    percentage += (100 - percentage) / 100
                                    reporter.next({ message: `Computing changes in ${path}`, percentage })
                                    return text.split(match).join(replacement)
                                },
                            },
                        ],
                        changesetTemplate: {
                            title: description,
                            branch: `campaign/${name}`,
                            commit: {
                                message: description,
                                author: {
                                    name: currentUser.username,
                                    email: currentUser.email,
                                },
                            },
                            published: false,
                        },
                    })
            )
            sourcegraph.app.activeWindow!.showNotification(
                `[**Find-replace changes**](${applyURL}) are ready to preview and apply.<br/><br/><small>${diffStat.changed} changes made.</small>`,
                sourcegraph.NotificationType.Success
            )
        })
    )
    return subscription
}
