import { mount } from "@torpor/view";

/**
 * Shows a notification component in code.
 * @param notification The notification component
 * @param props The properties for the notification component
 * @param target The target element to show the notification in
 */
export default function showNotification(notification: any, props: any, target?: Element): void {
	if (!target) {
		// Put the notification in the first NotificationContainer, or the
		// document body if there are no NotificationContainers
		target = document.getElementsByClassName("torp-notification-container")[0];
		if (!target) {
			throw new Error("No notification container found");
		}
	}

	// HACK: Should allow mounting in a non-empty container
	// Move existing nodes into a fragment, and add them back after mounting
	var fragment = document.createDocumentFragment();
	while (target.firstChild) {
		fragment.append(target.firstChild);
	}

	// Create the notification
	mount(target, notification, props);

	target.prepend(fragment);
}
