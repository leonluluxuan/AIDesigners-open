# Provider adapters

Independent mode replaces hosted execution behind the public interfaces in `@aidesigner/workflow-types`.

An independent implementation must provide its own authentication, storage, job persistence, billing policy, image provider, video-analysis provider, video provider, media processing, retries, and safety controls. Replacing one adapter does not reproduce AIDesigner's private prompt compilers or hosted tuning.

Provider credentials belong in environment variables or a secret manager. Never put credentials in a Skill, workflow file, fixture, or committed source.
