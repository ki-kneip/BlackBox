package domain

type LogFilter struct {
	ProjectID   string
	FolderID    string
	Level       Level
	Environment Environment
	AllowedEnvs []Environment // enforced from membership.env_access (empty = all)
}

func (f LogFilter) Matches(log *Log) bool {
	if f.ProjectID != "" && log.ProjectID != f.ProjectID {
		return false
	}
	if f.FolderID != "" && log.FolderID != f.FolderID {
		return false
	}
	if f.Level != "" && log.Level != f.Level {
		return false
	}
	if f.Environment != "" && log.Environment != f.Environment {
		return false
	}
	// Enforce env_access: if the subscriber can only see certain envs, filter here.
	if len(f.AllowedEnvs) > 0 {
		allowed := false
		for _, e := range f.AllowedEnvs {
			if e == log.Environment {
				allowed = true
				break
			}
		}
		if !allowed {
			return false
		}
	}
	return true
}
