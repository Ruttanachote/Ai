// Display helpers shared by every view, so a project reads the same everywhere.
import type { Project } from './data/model'
import { account } from './data/mock'

/** Customer as recorded in the customer register, falling back to the free-text name. */
export const customerName = (p: Project) => account(p.customerAccountId)?.name ?? p.customer
export const endUserName = (p: Project) => account(p.endUserAccountId)?.name ?? p.endUser
