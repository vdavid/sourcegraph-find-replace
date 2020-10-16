import * as sourcegraph from 'sourcegraph'
import { registerFindReplaceAction } from './register-action'

export function activate(context: sourcegraph.ExtensionContext): void {
    context.subscriptions.add(registerFindReplaceAction())
}
