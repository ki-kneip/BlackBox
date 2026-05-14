package auth

import "blackbox.io/core/internal/domain"

type Permission string

const (
	PermLogsView       Permission = "logs:view"
	PermFoldersManage  Permission = "folders:manage"
	PermIssuersManage  Permission = "issuers:manage"
	PermTriggersManage Permission = "triggers:manage"
	PermMembersManage  Permission = "members:manage"
	PermProjectManage  Permission = "project:manage"
)

var rolePermissions = map[domain.Role][]Permission{
	domain.RoleOwner: {
		PermLogsView,
		PermFoldersManage,
		PermIssuersManage,
		PermTriggersManage,
		PermMembersManage,
		PermProjectManage,
	},
	domain.RoleAdmin: {
		PermLogsView,
		PermFoldersManage,
		PermIssuersManage,
		PermTriggersManage,
	},
	domain.RoleMember: {
		PermLogsView,
		PermFoldersManage,
	},
	domain.RoleViewer: {
		PermLogsView,
	},
}

func Can(role domain.Role, perm Permission) bool {
	perms, ok := rolePermissions[role]
	if !ok {
		return false
	}
	for _, p := range perms {
		if p == perm {
			return true
		}
	}
	return false
}

// CanAccessEnv returns true when the membership allows access to the given environment.
// An empty EnvAccess slice means unrestricted access.
func CanAccessEnv(m *domain.Membership, env domain.Environment) bool {
	if len(m.EnvAccess) == 0 {
		return true
	}
	for _, e := range m.EnvAccess {
		if e == env {
			return true
		}
	}
	return false
}
