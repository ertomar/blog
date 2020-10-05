import { Component } from "@angular/core";
import { AngularFirestore } from "@angular/fire/firestore";
import { AngularFireDatabase } from "@angular/fire/database";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Component({
  selector: "app-home",
  templateUrl: "home.page.html",
  styleUrls: ["home.page.scss"],
})
export class HomePage {
  notifNumber: Observable<any[]>;
  notificationNumber: number;
  posts: Observable<any[]>;
  constructor(
    public db: AngularFireDatabase,
    public fireStore: AngularFirestore
  ) {
    db.list("notifications")
      .valueChanges()
      .subscribe((num) => {
        this.notificationNumber = (num[0] as number) || 0;
      });

    this.posts = db.list("posts").valueChanges();
    this.posts = this.db
      .list("posts")
      .snapshotChanges()
      .pipe(
        map((changes) =>
          changes.map((c) => ({
            key: c.payload.key,
            ...(c.payload.val() as object),
          }))
        )
      );
  }
  addPost(text: string = "Post") {
    this.db
      .list("posts")
      .push({ text: text })
      .then((_) => console.log("success"))
      .catch((err) => console.log(err, "You do not have access!"));
    this.changeNotification();
  }
  deletePost(key: string) {
    this.db.list("posts").remove(key);
  }
  addPostLike(key: string) {
    let inc = true;
    this.db.database
      .ref(`posts/${key}/likes`)
      .transaction(function (current_value) {
        if ((current_value || 0) === 0) {
          return (current_value || 0) + 1;
        } else {
          inc = false;
          return (current_value || 0) - 1;
        }
      });
    this.changeNotification(inc);
  }
  addPostComment(key: string, commentText: string | number) {
    this.db.list(`posts/${key}/comments`).push({ text: commentText });
    this.changeNotification();
  }
  addCommentLike(postKey: string, commentKey: string) {
    let inc = true;
    this.db.database
      .ref(`posts/${postKey}/comments/${commentKey}/likes`)
      .transaction(function (current_value) {
        if ((current_value || 0) == 0) {
          return (current_value || 0) + 1;
        } else {
          inc = false;
          return (current_value || 0) - 1;
        }
      });
    this.changeNotification(inc);
  }
  clearNotifications() {
    this.db.list("notifications").remove();
  }
  changeNotification(inc = true) {
    this.db.database
      .ref(`notifications/number`)
      .transaction(function (current_value) {
        let value: number = 1;
        if (!inc) {
          value = -1;
        }
        if ((current_value || 0) + value >= 0) {
          return (current_value || 0) + value;
        } else {
          return 0;
        }
      });
  }
}
