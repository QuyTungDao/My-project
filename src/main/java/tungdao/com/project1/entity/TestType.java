package tungdao.com.project1.entity;

public enum TestType {
    READING("Reading"),
    LISTENING("Listening"),
    WRITING("Writing"),
    SPEAKING("Speaking");

    private final String displayName;

    TestType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    // ✅ ADD: Method to get uppercase string
    public String toUpperCase() {
        return this.name().toUpperCase();
    }

    // ✅ ADD: Method to parse from string
    public static TestType fromString(String value) {
        if (value == null) return null;

        try {
            return TestType.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    // ✅ ADD: Check if test type matches
    public boolean matches(String value) {
        if (value == null) return false;
        return this.name().equalsIgnoreCase(value) ||
                this.displayName.equalsIgnoreCase(value);
    }
}
