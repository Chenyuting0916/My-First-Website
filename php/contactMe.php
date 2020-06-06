<?php
  $name = $_POST['name'];
  $visitor_email = $_POST['email'];
  $message = $_POST['message'];

  $email_from = 'tim376755000@gmail.com';

  $email_subject = "New Message!";

  $email_body = "User Name: $name.\n".
                  "User Email: $visitor_email.\n".
                    "User Message: $message.\n";

  $to = "chenyuting0916@hotmail.com";
  $to2 = "tim376755000@gmail.com";

  $header = "From: $email_from \r\n";

  mail($to, $email_subject, $email_body, $header);
  mail($to2, $email_subject, $email_body, $header);

  header("Location: contact.html");
?>