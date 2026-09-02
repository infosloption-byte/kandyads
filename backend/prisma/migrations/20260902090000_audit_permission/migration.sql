INSERT INTO `Permission` (`key`, `description`)
VALUES ('audit.read', 'Permission: audit.read')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

INSERT INTO `RolePermission` (`roleId`, `permissionId`)
SELECT r.`id`, p.`id`
FROM `Role` r
CROSS JOIN `Permission` p
WHERE r.`name` = 'Administrator' AND p.`key` = 'audit.read'
ON DUPLICATE KEY UPDATE `permissionId` = VALUES(`permissionId`);
