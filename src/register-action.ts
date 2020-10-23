import { Subscription } from 'rxjs'
import sourcegraph from 'sourcegraph'
import { evaluateAndCreateCampaignSpec } from '@sourcegraph/campaigns-client'
import slugify from 'slugify'
import { getCurrentUser } from './util'
import { editFile } from './edit-file'

// TODO: sanitize this for real, it gets used in the description of the campaign
const escapedMarkdownCode = (text: string): string => '`' + text.replace(/`/g, '\\`') + '`'

export const registerFindReplaceAction = (): Subscription => {
    const subscription = new Subscription()
    subscription.add(
        sourcegraph.commands.registerCommand('findReplace.startFindReplace', async (searchQuery: string) => {
            // TODO: in the future, use the search query to get the list of matching files.
            console.log('context.searchQuery', searchQuery)

            if (!searchQuery) {
                return
            }

            // To create campaigns, a namespace is used, which can be the current user's username.
            const currentUser = await getCurrentUser()
            if (!currentUser) {
                throw new Error('No current user')
            }
            const namespaceName = currentUser.username

            const findString = await sourcegraph.app.activeWindow!.showInputBox({
                prompt: 'Find all matches of:',
            })
            if (!findString) {
                return
            }

            const replacementString = await sourcegraph.app.activeWindow!.showInputBox({
                prompt: 'Replace with:',
            })
            // Empty string is a valid replacement, so compare directly with undefined.
            if (replacementString === undefined) {
                return
            }

            const campaignName = `replace-${slugify(findString)}-with-${slugify(replacementString)}`
            const description = `Replace ${escapedMarkdownCode(findString)} with ${escapedMarkdownCode(
                replacementString
            )}`

            let percentage = 0
            const { applyURL, diffStat } = await sourcegraph.app.activeWindow!.withProgress(
                { title: '**Find-replace**' },
                reporter =>
                    evaluateAndCreateCampaignSpec(namespaceName, {
                        name: campaignName,
                        on: [
                            {
                                repositoriesMatchingQuery: searchQuery,
                            },
                        ],
                        description,
                        steps: [
                            {
                                fileFilter: () => true,
                                editFile: (path, text) => {
                                    if (!text.includes(findString)) {
                                        // skip the file by returning null
                                        return null
                                    }

                                    percentage += (100 - percentage) / 100
                                    reporter.next({ message: `Computing changes in ${path}`, percentage })

                                    return editFile(text, findString, replacementString)
                                },
                            },
                        ],
                        changesetTemplate: {
                            title: description,
                            branch: `campaign/${campaignName}`,
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
