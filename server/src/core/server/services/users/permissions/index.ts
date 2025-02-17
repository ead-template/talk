import {
  isSiteMember,
  isSiteModerator,
  PermissionsAction,
} from "coral-common/common/lib/permissions/types";
import { MongoContext } from "coral-server/data/context";
import { GQLUSER_ROLE } from "coral-server/graph/schema/__generated__/types";
import {
  pullUserMembershipScopes,
  pullUserSiteModerationScopes,
  updateUserRole,
} from "coral-server/models/user";

type SideEffect = (mongo: MongoContext, tenantID: string) => Promise<any>;

export type PermissionsActionSideEffectTest = (
  action: PermissionsAction
) => SideEffect | undefined;

const userShouldBeDemotedToCommenter: PermissionsActionSideEffectTest = ({
  user,
  newUserRole,
  scopeDeletions,
}) => {
  if (!newUserRole || !scopeDeletions) {
    return;
  }

  const relevantScopes =
    newUserRole === GQLUSER_ROLE.MODERATOR
      ? user.moderationScopes
      : user.membershipScopes;

  const noneRemaining = !relevantScopes?.siteIDs?.find(
    (siteID) => !scopeDeletions.includes(siteID)
  );

  if (noneRemaining) {
    const demoteToCommenter = (mongo: MongoContext, tenantID: string) =>
      updateUserRole(mongo, tenantID, user.id, GQLUSER_ROLE.COMMENTER, false);
    return demoteToCommenter;
  }

  return async () => null;
};

const userShouldHaveModerationScopesRemoved: PermissionsActionSideEffectTest =
  ({ user, newUserRole, scopeDeletions }) => {
    const isSiteMod = isSiteModerator(user);
    const newRole = newUserRole !== GQLUSER_ROLE.MODERATOR;
    const allScopesDeleted = !!user.moderationScopes?.siteIDs?.every((id) =>
      scopeDeletions?.includes(id)
    );
    const userHadScopes = !!user.moderationScopes?.siteIDs;
    if (isSiteMod && (newRole || allScopesDeleted) && userHadScopes) {
      const removeModerationScopes = (mongo: MongoContext, tenantID: string) =>
        pullUserSiteModerationScopes(
          mongo,
          tenantID,
          user.id,
          user.moderationScopes!.siteIDs!
        );

      return removeModerationScopes;
    }

    return undefined;
  };

const userShouldHaveMembershipScopesRemoved: PermissionsActionSideEffectTest =
  ({ user, newUserRole }) => {
    if (
      isSiteMember(user) &&
      newUserRole !== GQLUSER_ROLE.MEMBER &&
      !!user.membershipScopes.siteIDs
    ) {
      const removeMembershipScopes = (mongo: MongoContext, tenantID: string) =>
        pullUserMembershipScopes(
          mongo,
          tenantID,
          user.id,
          user.membershipScopes.siteIDs!
        );

      return removeMembershipScopes;
    }

    return async () => null;
  };

export const sideEffectRules: PermissionsActionSideEffectTest[] = [
  userShouldHaveModerationScopesRemoved,
  userShouldHaveMembershipScopesRemoved,
  userShouldBeDemotedToCommenter,
];

/**
 * runSideEffects assumes an action has been deemed valid, and
 * checks for what actions need to be taken (if any) for the given action.
 */
export const resolveSideEffects = (action: PermissionsAction): SideEffect[] => {
  const sideEffects = sideEffectRules
    .map((rule) => rule(action))
    .filter((sideEffect) => !!sideEffect) as SideEffect[];

  return sideEffects;
};
