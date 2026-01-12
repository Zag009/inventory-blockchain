package com.inventory.blockchain.config;

import com.inventory.blockchain.entity.Permission;
import com.inventory.blockchain.entity.Role;
import com.inventory.blockchain.entity.User;
import com.inventory.blockchain.repository.PermissionRepository;
import com.inventory.blockchain.repository.RoleRepository;
import com.inventory.blockchain.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Component
public class DataInitializer implements CommandLineRunner {

    private final PermissionRepository permissionRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public DataInitializer(PermissionRepository permissionRepository,
                          RoleRepository roleRepository,
                          UserRepository userRepository) {
        this.permissionRepository = permissionRepository;
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (permissionRepository.count() == 0) {
            System.out.println("=== Starting Database Initialization ===");
            
            Map<String, Permission> permissions = createPermissions();
            Map<String, Role> roles = createRoles(permissions);
            createUsers(roles);
            
            System.out.println("=== Database Initialization Complete ===");
        } else {
            System.out.println("Database already initialized, skipping...");
        }
    }

    private Map<String, Permission> createPermissions() {
        System.out.println("Creating permissions...");
        Map<String, Permission> permissions = new HashMap<>();

        // User permissions
        permissions.put("users.create", createPermission("users.create", "Create Users", "Allows creating new users", "USERS"));
        permissions.put("users.read", createPermission("users.read", "View Users", "Allows viewing user information", "USERS"));
        permissions.put("users.update", createPermission("users.update", "Update Users", "Allows updating user information", "USERS"));
        permissions.put("users.delete", createPermission("users.delete", "Delete Users", "Allows deleting users", "USERS"));

        // Transfer permissions
        permissions.put("transfers.create", createPermission("transfers.create", "Create Transfers", "Allows creating inventory transfers", "TRANSFERS"));
        permissions.put("transfers.read", createPermission("transfers.read", "View Transfers", "Allows viewing transfers", "TRANSFERS"));
        permissions.put("transfers.update", createPermission("transfers.update", "Update Transfers", "Allows updating transfers", "TRANSFERS"));
        permissions.put("transfers.delete", createPermission("transfers.delete", "Delete Transfers", "Allows deleting transfers", "TRANSFERS"));
        permissions.put("transfers.approve", createPermission("transfers.approve", "Approve Transfers", "Allows approving transfers", "TRANSFERS"));

        // Inventory permissions
        permissions.put("inventory.create", createPermission("inventory.create", "Create Inventory", "Allows adding inventory items", "INVENTORY"));
        permissions.put("inventory.read", createPermission("inventory.read", "View Inventory", "Allows viewing inventory", "INVENTORY"));
        permissions.put("inventory.update", createPermission("inventory.update", "Update Inventory", "Allows updating inventory", "INVENTORY"));
        permissions.put("inventory.delete", createPermission("inventory.delete", "Delete Inventory", "Allows deleting inventory items", "INVENTORY"));

        // Reports permissions
        permissions.put("reports.read", createPermission("reports.read", "View Reports", "Allows viewing reports", "REPORTS"));
        permissions.put("reports.export", createPermission("reports.export", "Export Reports", "Allows exporting reports", "REPORTS"));

        // Audit permissions
        permissions.put("audit.read", createPermission("audit.read", "View Audit Logs", "Allows viewing audit logs", "AUDIT"));

        // Settings permissions
        permissions.put("settings.read", createPermission("settings.read", "View Settings", "Allows viewing system settings", "SETTINGS"));
        permissions.put("settings.update", createPermission("settings.update", "Update Settings", "Allows updating system settings", "SETTINGS"));

        // Supplier permissions
        permissions.put("suppliers.create", createPermission("suppliers.create", "Create Suppliers", "Allows creating suppliers", "SUPPLIERS"));
        permissions.put("suppliers.read", createPermission("suppliers.read", "View Suppliers", "Allows viewing suppliers", "SUPPLIERS"));
        permissions.put("suppliers.update", createPermission("suppliers.update", "Update Suppliers", "Allows updating suppliers", "SUPPLIERS"));
        permissions.put("suppliers.delete", createPermission("suppliers.delete", "Delete Suppliers", "Allows deleting suppliers", "SUPPLIERS"));

        // Analytics permissions
        permissions.put("analytics.read", createPermission("analytics.read", "View Analytics", "Allows viewing analytics dashboard", "ANALYTICS"));

        // Document permissions
        permissions.put("documents.create", createPermission("documents.create", "Create Documents", "Allows uploading documents", "DOCUMENTS"));
        permissions.put("documents.read", createPermission("documents.read", "View Documents", "Allows viewing documents", "DOCUMENTS"));
        permissions.put("documents.update", createPermission("documents.update", "Update Documents", "Allows updating documents", "DOCUMENTS"));
        permissions.put("documents.delete", createPermission("documents.delete", "Delete Documents", "Allows deleting documents", "DOCUMENTS"));

        System.out.println("✓ Created " + permissions.size() + " permissions");
        return permissions;
    }

    private Permission createPermission(String code, String name, String description, String category) {
        Permission permission = new Permission();
        permission.setCode(code);
        permission.setName(name);
        permission.setDescription(description);
        permission.setCategory(category);
        return permissionRepository.save(permission);
    }

    private Map<String, Role> createRoles(Map<String, Permission> permissions) {
        System.out.println("Creating roles...");
        Map<String, Role> roles = new HashMap<>();

        // ADMIN - All permissions
        Role admin = new Role();
        admin.setName("ADMIN");
        admin.setDescription("Full system administrator with all permissions");
        permissions.values().forEach(admin::addPermission);
        roles.put("ADMIN", roleRepository.save(admin));
        System.out.println("✓ Created ADMIN role with " + permissions.size() + " permissions");

        // MANAGER - Operations management
        Role manager = new Role();
        manager.setName("MANAGER");
        manager.setDescription("Operations manager with inventory and transfer management");
        addPermissionsToRole(manager, permissions,
            "transfers.create", "transfers.read", "transfers.update", "transfers.approve",
            "inventory.create", "inventory.read", "inventory.update",
            "reports.read", "reports.export",
            "suppliers.create", "suppliers.read", "suppliers.update",
            "analytics.read",
            "documents.create", "documents.read", "documents.update",
            "audit.read"
        );
        roles.put("MANAGER", roleRepository.save(manager));
        System.out.println("✓ Created MANAGER role");

        // WAREHOUSE_CLERK - Day-to-day operations
        Role clerk = new Role();
        clerk.setName("WAREHOUSE_CLERK");
        clerk.setDescription("Warehouse staff handling daily inventory operations");
        addPermissionsToRole(clerk, permissions,
            "transfers.create", "transfers.read", "transfers.update",
            "inventory.read", "inventory.update",
            "suppliers.read",
            "documents.read", "documents.create"
        );
        roles.put("WAREHOUSE_CLERK", roleRepository.save(clerk));
        System.out.println("✓ Created WAREHOUSE_CLERK role");

        // AUDITOR - Read-only audit access
        Role auditor = new Role();
        auditor.setName("AUDITOR");
        auditor.setDescription("Auditor with read-only access to all records");
        addPermissionsToRole(auditor, permissions,
            "transfers.read",
            "inventory.read",
            "reports.read", "reports.export",
            "suppliers.read",
            "analytics.read",
            "documents.read",
            "audit.read",
            "users.read"
        );
        roles.put("AUDITOR", roleRepository.save(auditor));
        System.out.println("✓ Created AUDITOR role");

        // VIEWER - Basic read-only access
        Role viewer = new Role();
        viewer.setName("VIEWER");
        viewer.setDescription("Basic viewer with minimal read permissions");
        addPermissionsToRole(viewer, permissions,
            "inventory.read",
            "transfers.read",
            "reports.read"
        );
        roles.put("VIEWER", roleRepository.save(viewer));
        System.out.println("✓ Created VIEWER role");

        return roles;
    }

    private void addPermissionsToRole(Role role, Map<String, Permission> permissions, String... permissionCodes) {
        for (String code : permissionCodes) {
            Permission permission = permissions.get(code);
            if (permission != null) {
                role.addPermission(permission);
            }
        }
    }

    private void createUsers(Map<String, Role> roles) {
        System.out.println("Creating demo users...");

        createUser("admin", "admin@company.com", "admin123", "System Administrator", roles.get("ADMIN"));
        createUser("manager", "manager@company.com", "manager123", "Operations Manager", roles.get("MANAGER"));
        createUser("clerk", "clerk@company.com", "clerk123", "Warehouse Clerk", roles.get("WAREHOUSE_CLERK"));
        createUser("auditor", "auditor@company.com", "auditor123", "External Auditor", roles.get("AUDITOR"));
        createUser("viewer", "viewer@company.com", "viewer123", "Report Viewer", roles.get("VIEWER"));

        System.out.println("✓ Created 5 demo users");
    }

    private void createUser(String username, String email, String password, String fullName, Role role) {
        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setFullName(fullName);
        user.setRole(role);
        user.setIsActive(true);
        userRepository.save(user);
    }
}
