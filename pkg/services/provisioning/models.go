package provisioning

import "errors"

const (
	DatasourceProvisionerUID    = "DatasourceProvisioner"
	PluginsProvisionerUID       = "PluginsProvisioner"
	DashboardProvisionerUID     = "DashboardProvisioner"
	NotificationsProvisionerUID = "NotificationsProvisioner"
)

var (
	ErrUnknownProvisioner = errors.New("unknown provisioner provided")
)
